"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowLeft, RefreshCw, FileText, Calendar, 
  Users, BookOpen, Clock, Trash2, ArrowUpRight, SearchCheck
} from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

interface SearchResult {
  id: string;
  entity_type: 'Student' | 'Notice' | 'Book' | 'Event' | 'Staff' | string;
  title: string;
  content: string;
  metadata?: any;
}

export default function GlobalSearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('iris_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleSearch = async (searchVal: string, catVal: string = category) => {
    if (!searchVal.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    
    // Add to recents list
    const updatedRecents = [
      searchVal,
      ...recentSearches.filter(s => s !== searchVal)
    ].slice(0, 5);
    setRecentSearches(updatedRecents);
    localStorage.setItem('iris_recent_searches', JSON.stringify(updatedRecents));

    try {
      const res = await apiGet('/ai/search', { q: searchVal, type: catVal });
      if (res.success) {
        setResults(res.results || []);
      }
    } catch {
      // Sandbox fallback matching mocks
      setTimeout(() => {
        const mockMatches: SearchResult[] = [];
        const lowQuery = searchVal.toLowerCase();
        
        const fallbackPool: SearchResult[]  = [];

        fallbackPool.forEach(item => {
          if (item.title.toLowerCase().includes(lowQuery) || item.content.toLowerCase().includes(lowQuery)) {
            mockMatches.push(item);
          }
        });

        setResults(mockMatches);
        setLoading(false);
      }, 500);
      return;
    }
    setLoading(false);
  };

  const handleClearRecents = () => {
    setRecentSearches([]);
    localStorage.removeItem('iris_recent_searches');
  };

  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'student':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'notice':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'book':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      default:
        return <SearchCheck className="w-4 h-4 text-white/50" />;
    }
  };

  const getEntityLink = (item: SearchResult) => {
    switch (item.entity_type.toLowerCase()) {
      case 'student':
        return `/director/students?id=${item.id}`;
      case 'notice':
        return '/student/notices';
      case 'book':
        return '/library';
      case 'event':
        return `/student/events`;
      default:
        return '/dashboard';
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]">
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <div>
              <h1 className="font-extrabold text-2xl text-white">Smart Global Search</h1>
              <p className="text-xs text-[#C4B5FD]/70">Unified semantic (pgvector) and keyword search across notices, books, events, and profiles</p>
            </div>
          </div>

          {/* Search bar input */}
          <div className="relative mt-2">
            <Search className="absolute left-4 top-4 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder="Search anything (e.g. attendance, Cormen, hackathon)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                handleSearch(e.target.value, category);
              }}
              className="w-full bg-[#13102A]/60 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:border-[#8B5CF6]/50 transition-all shadow-xl font-medium"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-2 text-xs font-bold pt-2 select-none">
            {['all', 'students', 'notices', 'books', 'events'].map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  handleSearch(query, cat);
                }}
                className={`px-3.5 py-1.5 rounded-xl border capitalize transition-all ${
                  category === cat
                    ? 'bg-[#6C2BD9]/20 text-[#A78BFA] border-[#8B5CF6]/50'
                    : 'bg-black/35 text-white/60 border-white/5 hover:bg-black/45 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* AI Sub-modules Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
            <Link href="/ai/voice" className="p-4 bg-[#13102A]/60 border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 rounded-2xl flex items-center justify-between group transition-all shadow-md">
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-[#A78BFA] transition-colors">🎙️ Voice Assistant</h4>
                <p className="text-[11px] text-[#C4B5FD]/70 mt-1">Speak with IRIS in Hindi & English</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#C4B5FD] opacity-60 group-hover:opacity-100 transition-all" />
            </Link>
            <Link href="/ai/nudges" className="p-4 bg-[#13102A]/60 border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 rounded-2xl flex items-center justify-between group transition-all shadow-md">
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-[#A78BFA] transition-colors">🔔 Smart Nudges</h4>
                <p className="text-[11px] text-[#C4B5FD]/70 mt-1">View inbox & quiet hours setup</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#C4B5FD] opacity-60 group-hover:opacity-100 transition-all" />
            </Link>
            <Link href="/ai/study-plan" className="p-4 bg-[#13102A]/60 border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 rounded-2xl flex items-center justify-between group transition-all shadow-md">
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-[#A78BFA] transition-colors">📖 Study Planner</h4>
                <p className="text-[11px] text-[#C4B5FD]/70 mt-1">Personalized exam schedules</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#C4B5FD] opacity-60 group-hover:opacity-100 transition-all" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Recents Searches left panel */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-white/45">
            <span>Recent queries</span>
            {recentSearches.length > 0 && (
              <button onClick={handleClearRecents} className="hover:text-red-400 flex items-center gap-0.5">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {recentSearches.length === 0 ? (
              <p className="text-[10px] text-white/20 font-mono">No recent searches.</p>
            ) : (
              recentSearches.map((rec, idx) => (
                <button
                  key={idx}
                  onClick={() => { setQuery(rec); handleSearch(rec); }}
                  className="w-full text-left p-2.5 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 text-xs text-[#C4B5FD]/80 hover:text-white transition-all flex items-center gap-2"
                >
                  <Clock className="w-3.5 h-3.5 opacity-40" />
                  <span className="truncate">{rec}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Results List panel */}
        <div className="md:col-span-3 space-y-4">
          <div className="text-xs font-bold text-white flex items-center justify-between border-b border-white/5 pb-2">
            <span>Search Results</span>
            {loading && <RefreshCw className="w-4 h-4 animate-spin text-[#A78BFA]" />}
          </div>

          {loading && results.length === 0 ? (
            <p className="text-center text-xs text-white/30 py-16">Executing vector matches on indices records...</p>
          ) : results.length === 0 ? (
            <div className="py-16 text-center bg-[#13102A]/40 rounded-3xl border border-white/5 text-sm text-white/30">
              Enter search keywords to lookup database profiles.
            </div>
          ) : (
            <div className="space-y-3.5">
              {results.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 bg-[#13102A]/60 border border-white/5 rounded-2xl flex justify-between items-center gap-4 hover:border-white/10 hover:bg-[#1A1835]/40 transition-all shadow-md"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getEntityIcon(item.entity_type)}
                      <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/50 font-mono">
                        {item.entity_type}
                      </span>
                      <h4 className="font-extrabold text-sm text-white truncate">{item.title}</h4>
                    </div>
                    <p className="text-xs text-[#C4B5FD]/75 leading-relaxed truncate">{item.content}</p>
                  </div>

                  <Link 
                    href={getEntityLink(item)}
                    className="p-2.5 bg-white/5 border border-white/5 hover:bg-white/10 transition-all rounded-xl text-[#C4B5FD]"
                  >
                    <ArrowUpRight className="w-4.5 h-4.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
