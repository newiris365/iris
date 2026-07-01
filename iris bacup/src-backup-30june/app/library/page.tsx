"use client";

import React, { useState, useEffect } from 'react';
import { Book, Search, Filter, Sparkles, BookOpen, Clock, AlertTriangle, ArrowRight, User } from 'lucide-react';
import { apiGet } from '../../lib/api';
import Link from 'next/link';

export default function LibrarySearchPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [aiExplanation, setAiExplanation] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    loadLibraryData();
  }, []);

  const loadLibraryData = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const [booksRes, recRes] = await Promise.all([
        apiGet('/library/books'),
        apiGet(`/library/recommendations/${studentId}`)
      ]);

      if (booksRes.success) {
        setBooks(booksRes.books || []);
      }
      if (recRes.success) {
        setRecommendations(recRes.recommendations || []);
        setAiExplanation(recRes.explanation || '');
      }
    } catch {
      // Mock Fallbacks
      setBooks([
        { id: 'b1', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'Computer Science', copies_available: 4, cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300', shelf_location: 'Aisle 3, Shelf B' },
        { id: 'b2', title: 'Design Patterns', author: 'Erich Gamma', category: 'Computer Science', copies_available: 0, cover_image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300', shelf_location: 'Aisle 3, Shelf C' },
        { id: 'b3', title: 'Calculus: Early Transcendentals', author: 'James Stewart', category: 'Mathematics', copies_available: 2, cover_image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300', shelf_location: 'Aisle 1, Shelf A' }
      ]);
      setRecommendations([
        { id: 'b1', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'Computer Science', cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300' }
      ]);
      setAiExplanation('Based on your computer science enrollment, we recommend starting with fundamental design structures.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = async (val: string) => {
    setSearch(val);
    try {
      const res = await apiGet(`/library/books?search=${val}&category=${category}&available=${availableOnly}`);
      if (res.success) setBooks(res.books || []);
    } catch {
      // Offline fallback search
    }
  };

  const handleCategoryChange = async (cat: string) => {
    setCategory(cat);
    try {
      const res = await apiGet(`/library/books?search=${search}&category=${cat}&available=${availableOnly}`);
      if (res.success) setBooks(res.books || []);
    } catch {
      // Offline fallback search
    }
  };

  const handleAvailableToggle = async () => {
    const nextVal = !availableOnly;
    setAvailableOnly(nextVal);
    try {
      const res = await apiGet(`/library/books?search=${search}&category=${category}&available=${nextVal}`);
      if (res.success) setBooks(res.books || []);
    } catch {
      // Offline fallback search
    }
  };

  const categories = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Literature', 'General'];

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Book className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">IRIS Library+</h1>
              <p className="text-sm text-[#C4B5FD]/70">Search Catalogue • AI Recommendations • E-Resources</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <Link href="/library/my-books" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> My Borrowed Books
            </Link>
            <Link href="/library/ebooks" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> E-Resources
            </Link>
            <Link href="/library/study-rooms" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Study Rooms
            </Link>
            <Link href="/library/fines" className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Fines
            </Link>
          </div>
        </div>
      </div>

      {/* AI Recommendations Panel */}
      {recommendations.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#1A1538] to-[#13102A] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C2BD9]/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#A78BFA] animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#C4B5FD]">AI Recommendations</h2>
            </div>
            
            <p className="text-xs text-[#C4B5FD]/80 leading-relaxed mb-6 max-w-2xl">
              "{aiExplanation}"
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recommendations.slice(0, 5).map(rec => (
                <Link key={rec.id} href={`/library/books/${rec.id}`} className="group p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
                  <div className="w-full aspect-[3/4] rounded-xl bg-white/5 overflow-hidden relative shadow-md">
                    {rec.cover_image_url ? (
                      <img src={rec.cover_image_url} alt={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20"><Book className="w-8 h-8" /></div>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2.5 truncate">{rec.title}</h4>
                  <p className="text-[10px] text-[#C4B5FD]/50 truncate mt-0.5">{rec.author}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Catalogue Search Section */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Filter Bar */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#A78BFA]" /> Filter Catalogue
          </h3>

          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-6 shadow-xl">
            <div>
              <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Category</label>
              <select
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-xs text-[#C4B5FD]/80">Available Copies Only</span>
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={handleAvailableToggle}
                className="accent-[#6C2BD9]"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Catalogue Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex bg-[#13102A]/60 border border-white/5 rounded-2xl px-4 py-3 items-center gap-3 shadow-lg">
            <Search className="w-5 h-5 text-[#C4B5FD]/50" />
            <input
              type="text"
              placeholder="Search by Title, Author, ISBN, or keywords..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="bg-transparent flex-1 text-sm text-white focus:outline-none placeholder-white/20"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
              No matching books found in the catalogue.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {books.map(bk => (
                <Link
                  key={bk.id}
                  href={`/library/books/${bk.id}`}
                  className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-4 shadow-lg flex flex-col justify-between hover:bg-[#1A1538] hover:border-[#6C2BD9]/20 transition-all group"
                >
                  <div>
                    <div className="w-full aspect-[3/4] rounded-xl bg-white/5 overflow-hidden relative shadow-md">
                      {bk.cover_image_url ? (
                        <img src={bk.cover_image_url} alt={bk.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20"><Book className="w-8 h-8" /></div>
                      )}
                    </div>
                    
                    <h3 className="text-xs font-bold text-white mt-3 truncate">{bk.title}</h3>
                    <p className="text-[10px] text-[#C4B5FD]/50 truncate mt-0.5">{bk.author}</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[8px] font-bold bg-[#6C2BD9]/25 text-[#A78BFA] border border-[#6C2BD9]/20 mt-2 capitalize">
                      {bk.category || 'General'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                    <span className={`text-[9px] font-semibold ${bk.copies_available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {bk.copies_available > 0 ? `${bk.copies_available} Copies left` : 'Out of Stock'}
                    </span>
                    <span className="text-[9px] text-[#C4B5FD]/40 font-mono truncate max-w-[50%]">{bk.shelf_location || 'Aisle 1'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
