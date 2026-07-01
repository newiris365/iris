"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Star, Book } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface BookItem {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available_copies: number;
  total_copies: number;
  rating: number;
}

export default function LibraryBooksPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('core/books');
        if (res.success) setBooks(res.books || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const categories = Array.from(new Set(books.map(b => b.category).filter(Boolean)));
  const filtered = books.filter(b =>
    (category === 'all' || b.category === category) &&
    (!search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <BookOpen size={24} className="text-cyan-400" />
        Browse Books
        {books.length > 0 && (
          <span className="bg-cyan-500/20 text-cyan-400 text-sm px-2 py-0.5 rounded-full">{books.length}</span>
        )}
      </h1>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            placeholder="Search by title or author..." />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${category === 'all' ? 'bg-cyan-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            All
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${category === c ? 'bg-cyan-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading books...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
          <p>No books found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b => (
            <div key={b.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Book size={20} className="text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">{b.title}</h3>
                  <p className="text-xs text-slate-400">{b.author}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500">ISBN: {b.isbn || '—'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${b.available_copies > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {b.available_copies > 0 ? `${b.available_copies} available` : 'Unavailable'}
                    </span>
                  </div>
                  {b.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={10} className={i < b.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
