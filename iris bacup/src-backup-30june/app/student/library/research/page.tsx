"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Book, ArrowRight, HelpCircle, FileText, SplitSquareVertical } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AIResearchPage() {
  const [activeTab, setActiveTab] = useState<'brief' | 'summarize' | 'compare'>('brief');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // AI Research Brief State
  const [topic, setTopic] = useState('');
  const [researchBrief, setResearchBrief] = useState<any>(null);

  // Book Summarizer State
  const [selectedBookId, setSelectedBookId] = useState('');
  const [summary, setSummary] = useState<string[]>([]);

  // Book Comparison State
  const [bookAId, setBookAId] = useState('');
  const [bookBId, setBookBId] = useState('');
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const res = await apiGet('/library/books');
      if (res.success) {
        setBooks(res.books || []);
      }
    } catch (err) {
      console.error('Failed to load books for AI research options', err);
    }
  };

  const handleGenerateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setResearchBrief(null);
    try {
      const res = await apiPost('/library/ai/research', { topic });
      if (res.success) {
        setResearchBrief(res.research_brief);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedBookId) return;
    setLoading(true);
    setSummary([]);
    try {
      const res = await apiPost('/library/ai/summarize', { book_id: selectedBookId });
      if (res.success) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!bookAId || !bookBId) return;
    setLoading(true);
    setComparison(null);
    try {
      const res = await apiPost('/library/ai/compare', { book_a_id: bookAId, book_b_id: bookBId });
      if (res.success) {
        setComparison(res.comparison);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">AI Research Assistant</h1>
              <p className="text-sm text-[#C4B5FD]/70">Powered by Anthropic Claude • Instant summaries, concepts & comparison lists</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* Module Sub-Tabs */}
        <div className="flex border-b border-white/5 mb-8">
          <button
            onClick={() => setActiveTab('brief')}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'brief' ? 'border-[#6C2BD9] text-white' : 'border-transparent text-[#C4B5FD]/50 hover:text-white'
            }`}
          >
            Topic Research Brief
          </button>
          <button
            onClick={() => setActiveTab('summarize')}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'summarize' ? 'border-[#6C2BD9] text-white' : 'border-transparent text-[#C4B5FD]/50 hover:text-white'
            }`}
          >
            Book Summarizer
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'compare' ? 'border-[#6C2BD9] text-white' : 'border-transparent text-[#C4B5FD]/50 hover:text-white'
            }`}
          >
            Compare Textbooks
          </button>
        </div>

        {/* Tab CONTENT 1: Brief Generation */}
        {activeTab === 'brief' && (
          <div className="space-y-6">
            <form onSubmit={handleGenerateBrief} className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Research Topic</label>
                <div className="flex bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-3 items-center gap-3">
                  <Search className="w-5 h-5 text-[#C4B5FD]/50" />
                  <input
                    type="text"
                    placeholder="e.g. Quantum Computing algorithms, Machine Learning models in healthcare..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-transparent flex-1 text-sm text-white focus:outline-none placeholder-white/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/30 disabled:opacity-55"
              >
                {loading ? 'Synthesizing...' : 'Generate AI Brief'}
              </button>
            </form>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#C4B5FD]/50">Claude API generating research brief...</span>
              </div>
            )}

            {researchBrief && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                {/* Left Columns: Concepts & Suggested Books */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Key Concepts */}
                  <div className="glass-panel p-6 rounded-3xl border border-[#6C2BD9]/20 bg-[#13102A]/80 shadow-xl">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-[#A78BFA]" /> Key Theoretical Concepts
                    </h3>
                    <div className="space-y-4">
                      {researchBrief.key_concepts?.map((c: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <h4 className="text-xs font-bold text-[#A78BFA]">{c.title}</h4>
                          <p className="text-xs text-[#C4B5FD]/70 mt-1 leading-relaxed">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Books */}
                  <div className="glass-panel p-6 rounded-3xl border border-[#6C2BD9]/20 bg-[#13102A]/80 shadow-xl">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <Book className="w-5 h-5 text-[#A78BFA]" /> Suggested Catalogue Matches
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {researchBrief.suggested_books?.map((b: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">Recommended</span>
                            <h4 className="text-xs font-bold text-white mt-1 truncate">{b.title}</h4>
                            <p className="text-[10px] text-[#C4B5FD]/50 truncate">by {b.author}</p>
                            <p className="text-[11px] text-[#C4B5FD]/75 mt-2.5 leading-relaxed">{b.relevance}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Reading List & References */}
                <div className="space-y-6">
                  {/* Recommended Reading Plan */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[#C4B5FD]">Reading Roadmap</h3>
                    <div className="space-y-3">
                      {researchBrief.reading_list?.map((step: string, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <span className="w-5 h-5 rounded-full bg-[#6C2BD9]/30 text-[#A78BFA] flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-[#C4B5FD]/90">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* External References */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[#C4B5FD]">External Journals & Links</h3>
                    <div className="space-y-3">
                      {researchBrief.external_references?.map((r: any, idx: number) => (
                        <a
                          key={idx}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                        >
                          <h4 className="text-xs font-bold text-white truncate">{r.title}</h4>
                          <div className="flex justify-between items-center mt-1.5">
                            <span className="text-[9px] text-[#C4B5FD]/50">{r.citation}</span>
                            <span className="text-[9px] text-[#A78BFA] flex items-center gap-0.5">View URL <ArrowRight className="w-2.5 h-2.5" /></span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab CONTENT 2: Book Summarizer */}
        {activeTab === 'summarize' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Select Book to Summarize</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                >
                  <option value="">-- Choose a book from library catalogue --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title} (by {b.author})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSummarize}
                disabled={loading || !selectedBookId}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/30 disabled:opacity-55"
              >
                {loading ? 'Analyzing...' : 'Generate 5-Point Summary'}
              </button>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#C4B5FD]/50">Claude AI analyzing descriptions and reviews...</span>
              </div>
            )}

            {summary.length > 0 && (
              <div className="glass-panel p-6 rounded-3xl border border-[#6C2BD9]/20 bg-[#13102A]/80 shadow-xl animate-fadeIn">
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#A78BFA]" /> Claude 5-Point Summary
                </h3>
                <div className="space-y-4">
                  {summary.map((point, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-[#0D0A1A]/60 border border-white/5">
                      <span className="w-6 h-6 rounded-lg bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-[#C4B5FD]/95 leading-relaxed mt-0.5">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab CONTENT 3: Book Comparison */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Select Two Textbooks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#C4B5FD]/50 mb-1">Book A</label>
                  <select
                    value={bookAId}
                    onChange={(e) => setBookAId(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                  >
                    <option value="">-- Choose Book A --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>{b.title} (by {b.author})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#C4B5FD]/50 mb-1">Book B</label>
                  <select
                    value={bookBId}
                    onChange={(e) => setBookBId(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                  >
                    <option value="">-- Choose Book B --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>{b.title} (by {b.author})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCompare}
                  disabled={loading || !bookAId || !bookBId}
                  className="px-6 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/30 disabled:opacity-55 flex items-center gap-1.5"
                >
                  <SplitSquareVertical className="w-4 h-4" /> {loading ? 'Analyzing Comparisons...' : 'Compare Suitability'}
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#C4B5FD]/50">Claude AI comparing clarity, code depth & structure...</span>
              </div>
            )}

            {comparison && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                {/* Book A vs Book B details */}
                <div className="glass-panel p-6 rounded-3xl border border-[#6C2BD9]/20 bg-[#13102A]/80 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-[#A78BFA] uppercase tracking-wider">Book-Specific Focus</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Book A Focus</span>
                      <p className="text-xs text-[#C4B5FD] mt-2 leading-relaxed">{comparison.book_a_focus}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">Book B Focus</span>
                      <p className="text-xs text-[#C4B5FD] mt-2 leading-relaxed">{comparison.book_b_focus}</p>
                    </div>
                  </div>
                </div>

                {/* Suitability and Verdict */}
                <div className="glass-panel p-6 rounded-3xl border border-[#6C2BD9]/20 bg-[#13102A]/80 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Coursework Suitability</h3>
                  <div className="p-4 rounded-xl bg-[#0D0A1A]/60 border border-white/5">
                    <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-wider">Comparison Metrics</span>
                    <p className="text-xs text-[#C4B5FD]/90 mt-2 leading-relaxed">{comparison.suitability_comparison}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#6C2BD9]/20 to-[#8B5CF6]/10 border border-[#6C2BD9]/30">
                    <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">Final AI Verdict</span>
                    <p className="text-xs text-white font-semibold mt-2 leading-relaxed">{comparison.recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
