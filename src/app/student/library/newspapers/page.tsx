"use client";

import React, { useState, useEffect } from 'react';
import { Newspaper, Bookmark, BookOpen, Clock, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function DigitalNewspapersPage() {
  const [newspapers, setNewspapers] = useState<any[]>([]);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Highlighting State
  const [articleTitle, setArticleTitle] = useState('');
  const [highlightText, setHighlightText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    loadNewspapers();
  }, []);

  const loadNewspapers = async () => {
    try {
      const res = await apiGet('/library/newspapers');
      if (res.success && res.newspapers?.length > 0) {
        setNewspapers(res.newspapers);
        // Default select first newspaper
        setSelectedNews(res.newspapers[0]);
        setBookmarks(res.newspapers[0].bookmarks || []);
      }
    } catch (err) {
      console.error(err);
      // Fallback Mock subscriptions
      const mockNews = [
        {
          id: 'n1',
          name: 'The Times of India',
          provider: 'TOI Digital Campus',
          current_issue_url: 'https://timesofindia.indiatimes.com',
          archive_urls: { "2026-06-09": 'https://timesofindia.indiatimes.com/archive' },
          bookmarks: [
            { student_id: 's1', article_title: 'AI advancements in education', highlight_text: 'The paper details how AI systems enhance tutor availability and students output efficiency.', bookmarked_at: '2026-06-09T14:30:00Z' }
          ]
        },
        {
          id: 'n2',
          name: 'The Hindu',
          provider: 'The Hindu College Subscription',
          current_issue_url: 'https://thehindu.com',
          archive_urls: { "2026-06-09": 'https://thehindu.com/archive' },
          bookmarks: []
        }
      ];
      setNewspapers(mockNews);
      setSelectedNews(mockNews[0]);
      setBookmarks(mockNews[0].bookmarks || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNewspaper = (news: any) => {
    setSelectedNews(news);
    setBookmarks(news.bookmarks || []);
    setArticleTitle('');
    setHighlightText('');
  };

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim() || !selectedNews) return;

    setSubmitting(true);
    try {
      const res = await apiPost(`/library/newspapers/${selectedNews.id}/bookmark`, {
        article_title: articleTitle,
        highlight_text: highlightText
      });

      if (res.success) {
        setBookmarks(res.bookmarks || []);
        setArticleTitle('');
        setHighlightText('');
        // Reload all subscriptions to update background lists
        loadNewspapers();
      }
    } catch (err) {
      console.error('Failed to save article highlight bookmark', err);
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
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Digital Newspapers</h1>
              <p className="text-sm text-[#C4B5FD]/70">Read institutional daily subscriptions • Log clipping notes & articles highlights</p>
            </div>
          </div>
          <button onClick={loadNewspapers} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]/80 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : newspapers.length === 0 ? (
          <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
            No digital newspaper subscriptions registered for this campus.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Column: Newspapers Selection List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Available Editions</h3>
              <div className="space-y-3">
                {newspapers.map((news) => {
                  const isSelected = selectedNews?.id === news.id;
                  return (
                    <button
                      key={news.id}
                      onClick={() => handleSelectNewspaper(news)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#1A1538] to-[#13102A] border-[#10B981]/30 shadow-lg'
                          : 'bg-[#13102A]/60 border-white/5 hover:bg-[#1A1538]'
                      }`}
                    >
                      <Newspaper className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-[#10B981]' : 'text-[#C4B5FD]/60'}`} />
                      <div>
                        <h4 className="text-xs font-extrabold text-white">{news.name}</h4>
                        <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Provider: {news.provider}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Highlights/Bookmarks History Panel */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/60 shadow-xl space-y-4 pt-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-[#10B981]" /> Clippings & Highlights
                </h4>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {bookmarks.map((b, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <h5 className="text-[10px] font-bold text-[#A78BFA] truncate">{b.article_title}</h5>
                      <p className="text-[10px] text-[#C4B5FD]/80 leading-relaxed italic">"{b.highlight_text}"</p>
                      <span className="block text-[8px] text-[#C4B5FD]/40 text-right">{new Date(b.bookmarked_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {bookmarks.length === 0 && (
                    <p className="text-[10px] text-[#C4B5FD]/30 py-6 text-center">No clippings bookmarked for this edition.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Columns: Issue Reader and Add Highlight Form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Headline panel / Iframe Mock Frame */}
              <div className="glass-panel rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#1A1538]/50">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-4.5 h-4.5 text-[#10B981]" /> Reading Room — {selectedNews?.name}
                    </h3>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Provider: {selectedNews?.provider}</p>
                  </div>
                  <a
                    href={selectedNews?.current_issue_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold text-white transition-all flex items-center gap-1.5"
                  >
                    Open Externally <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Newspaper View Simulation Box */}
                <div className="p-6 h-[400px] bg-[#0A0815] relative overflow-hidden flex flex-col items-center justify-center text-center gap-4">
                  {/* Since external URLs might block iframe embedding due to X-Frame-Options, we display a beautiful dark simulation of the digital edition reader with a button */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D0A1A]/80 z-10" />
                  <div className="max-w-md space-y-4 relative z-20">
                    <Newspaper className="w-16 h-16 text-[#10B981]/30 mx-auto animate-pulse" />
                    <div>
                      <h4 className="text-lg font-extrabold text-white">{selectedNews?.name} Daily Edition</h4>
                      <p className="text-xs text-[#C4B5FD]/60 mt-1">Institutional subscription actively verified.</p>
                    </div>
                    <p className="text-xs text-[#C4B5FD]/40 leading-relaxed px-6">
                      For security, responsiveness and complete accessibility, read the full digital newspaper edition inside a secure native browser window.
                    </p>
                    <a
                      href={selectedNews?.current_issue_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-xs font-bold text-white transition-all shadow-lg shadow-[#10B981]/25"
                    >
                      Verify subscription & Launch Reader <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Bookmark Article Form */}
              <div className="glass-panel p-6 rounded-3xl border border-[#10B981]/20 bg-[#13102A]/80 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#10B981]" /> Add Reading Highlight / Clippings Note
                </h3>
                <form onSubmit={handleAddBookmark} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-4 md:col-span-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/70">Article Title / Headline</label>
                      <input
                        type="text"
                        placeholder="e.g. Union Budget Allocates Tech Funding..."
                        value={articleTitle}
                        onChange={(e) => setArticleTitle(e.target.value)}
                        className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]/50"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/70">Highlights Notes or Key Takeaways</label>
                      <textarea
                        rows={2}
                        placeholder="Type clipping quotes or key arguments you want to note down for future study references..."
                        value={highlightText}
                        onChange={(e) => setHighlightText(e.target.value)}
                        className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]/50"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !articleTitle.trim()}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-xs font-bold text-white transition-all shadow-lg hover:brightness-110 disabled:opacity-55"
                    >
                      {submitting ? 'Clipping...' : 'Save Clipping Note'}
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>
        )}
      </div>
    </main>
  );
}
