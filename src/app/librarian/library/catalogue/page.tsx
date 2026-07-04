"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Search, Plus, Sparkles, AlertCircle, CheckCircle, FileSpreadsheet, Edit3, Loader2, X } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function LibrarianCataloguePage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const [form, setForm] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publication_year: new Date().getFullYear(),
    category: 'Computer Science',
    copies_total: 1,
    copies_available: 1,
    shelf_location: '',
    cover_image_url: '',
    description: '',
    tags: [] as string[]
  });

  const [bulkIsbns, setBulkIsbns] = useState('');
  const [bulkResults, setBulkResults] = useState<{ isbn: string; status: string; title?: string }[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    loadCatalogue();
  }, []);

  const loadCatalogue = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/library/books');
      if (res.success) {
        setBooks(res.books || []);
        setErrorMsg('');
      } else {
        setErrorMsg(res.error || 'Failed to load catalogue.');
      }
    } catch {
      setErrorMsg('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleIsbnLookup = async () => {
    if (!form.isbn.trim()) {
      setErrorMsg('Please enter an ISBN to lookup.');
      return;
    }
    setLookingUp(true);
    setErrorMsg('');
    try {
      const res = await apiPost('/library/books/isbn-lookup', { isbn: form.isbn });
      if (res.success && res.book) {
        setForm(prev => ({
          ...prev,
          title: res.book.title || prev.title,
          author: res.book.author || prev.author,
          publisher: res.book.publisher || prev.publisher,
          publication_year: res.book.publication_year || prev.publication_year,
          category: res.book.category || prev.category,
          description: res.book.description || prev.description,
          cover_image_url: res.book.cover_image_url || prev.cover_image_url
        }));
        setSuccessMsg('Book metadata auto-filled from Google Books!');
      } else {
        setErrorMsg('ISBN lookup failed. Please input details manually.');
      }
    } catch {
      setErrorMsg('ISBN lookup failed. Please enter details manually.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      setErrorMsg('Book Title and Author are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: any = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        copies_total: form.copies_total,
        copies_available: form.copies_available,
        tags: form.tags,
      };
      if (form.isbn.trim()) payload.isbn = form.isbn.trim();
      if (form.publisher.trim()) payload.publisher = form.publisher.trim();
      if (form.shelf_location.trim()) payload.shelf_location = form.shelf_location.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.cover_image_url.trim()) payload.cover_image_url = form.cover_image_url.trim();
      if (form.publication_year) payload.publication_year = form.publication_year;

      const res = await apiPost('/library/books', payload);
      if (res.success) {
        setSuccessMsg('Book registered successfully!');
        setShowAddForm(false);
        setForm({
          isbn: '', title: '', author: '', publisher: '', publication_year: new Date().getFullYear(),
          category: 'Computer Science', copies_total: 1, copies_available: 1, shelf_location: '',
          cover_image_url: '', description: '', tags: []
        });
        await loadCatalogue();
      } else {
        setErrorMsg(res.error || 'Failed to create book.');
      }
    } catch {
      setErrorMsg('Failed to connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkIsbns.trim()) {
      setErrorMsg('Please enter at least one ISBN.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setBulkResults([]);

    const isbnList = bulkIsbns.split('\n').map(i => i.trim()).filter(Boolean);
    const results: { isbn: string; status: string; title?: string }[] = [];
    let successCount = 0;

    for (const isbn of isbnList) {
      try {
        const lookupRes = await apiPost('/library/books/isbn-lookup', { isbn });
        let bookData: any;

        if (lookupRes.success && lookupRes.book) {
          bookData = {
            isbn,
            title: lookupRes.book.title || `Book (${isbn})`,
            author: lookupRes.book.author || 'Unknown Author',
            category: lookupRes.book.category || 'General',
            publisher: lookupRes.book.publisher || null,
            description: lookupRes.book.description || null,
            cover_image_url: lookupRes.book.cover_image_url || null,
            copies_total: 1,
            copies_available: 1,
          };
        } else {
          bookData = {
            isbn,
            title: `Book (${isbn})`,
            author: 'Unknown Author',
            category: 'General',
            copies_total: 1,
            copies_available: 1,
          };
        }

        const importRes = await apiPost('/library/books', bookData);
        if (importRes.success) {
          results.push({ isbn, status: 'success', title: bookData.title });
          successCount++;
        } else {
          results.push({ isbn, status: 'failed', title: importRes.error });
        }
      } catch {
        results.push({ isbn, status: 'failed', title: 'Connection error' });
      }

      setBulkResults([...results]);
    }

    if (successCount > 0) {
      setSuccessMsg(`Imported ${successCount} of ${isbnList.length} books.`);
      await loadCatalogue();
    } else {
      setErrorMsg(`Failed to import all ${isbnList.length} books.`);
    }

    setSubmitting(false);
  };

  const openAddForm = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddForm(true);
  };

  const openBulkImport = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setBulkResults([]);
    setShowBulkImport(true);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3 relative z-10">
            <Link href="/librarian/library" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Catalogue & Book Manager</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Register library inventory, configure copies availability, and import files</p>
            </div>
          </div>

          <div className="flex gap-2.5 relative z-10">
            <button
              type="button"
              onClick={openBulkImport}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel Bulk Import
            </button>
            <button
              type="button"
              onClick={openAddForm}
              className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Book
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-lg w-full space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#A78BFA]" /> Register New Book
                </h3>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">ISBN Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 978-0262033848"
                      value={form.isbn}
                      onChange={e => setForm({ ...form, isbn: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-[#6C2BD9] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleIsbnLookup}
                    disabled={lookingUp}
                    className="px-4 py-2.5 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    {lookingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {lookingUp ? 'Looking...' : 'Lookup'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Book Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Design Patterns"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-[#6C2BD9] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Author Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Erich Gamma"
                      value={form.author}
                      onChange={e => setForm({ ...form, author: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-[#6C2BD9] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Publisher</label>
                    <input
                      type="text"
                      placeholder="e.g. Pearson Education"
                      value={form.publisher}
                      onChange={e => setForm({ ...form, publisher: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-[#6C2BD9] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Shelf Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Aisle 3, Shelf B"
                      value={form.shelf_location}
                      onChange={e => setForm({ ...form, shelf_location: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-[#6C2BD9] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Copies Total</label>
                    <input
                      type="number"
                      min="1"
                      value={form.copies_total}
                      onChange={e => setForm({ ...form, copies_total: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-[#6C2BD9] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Copies Available</label>
                    <input
                      type="number"
                      min="0"
                      value={form.copies_available}
                      onChange={e => setForm({ ...form, copies_available: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-[#6C2BD9] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Short description summary..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white resize-none focus:border-[#6C2BD9] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Registering...</> : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showBulkImport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <form onSubmit={handleBulkImport} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-lg w-full space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#A78BFA]" /> Bulk Import Books
                </h3>
                <button type="button" onClick={() => setShowBulkImport(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#C4B5FD]/60">
                Enter one ISBN per line. Each ISBN will be looked up via Google Books for title, author, and category metadata.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">ISBN List</label>
                <textarea
                  rows={8}
                  placeholder={"978-0262033848\n978-0201633610\n978-0134685991"}
                  value={bulkIsbns}
                  onChange={e => setBulkIsbns(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/10 resize-none font-mono focus:border-[#6C2BD9] focus:outline-none"
                />
              </div>

              {bulkResults.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {bulkResults.map((r, i) => (
                    <div key={i} className={`text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-2 ${r.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {r.status === 'success' ? <CheckCircle className="w-3 h-3 flex-shrink-0" /> : <AlertCircle className="w-3 h-3 flex-shrink-0" />}
                      <span className="font-mono">{r.isbn}</span>
                      <span className="opacity-60">—</span>
                      <span className="truncate">{r.title || r.status}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkImport(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold"
                >
                  {bulkResults.length > 0 ? 'Close' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !bulkIsbns.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Importing...</> : 'Import Books'}
                </button>
              </div>
            </form>
          </div>
        )}

        <h2 className="text-sm font-bold text-[#C4B5FD]/80 mb-4">Book catalogue index</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#C4B5FD]/20 mx-auto mb-3" />
            <p className="text-sm text-[#C4B5FD]/40">No books in the catalogue yet.</p>
            <p className="text-xs text-[#C4B5FD]/25 mt-1">Click &quot;Add Book&quot; to register your first book.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 overflow-hidden shadow-xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[9px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">
                  <th className="p-4">Book Details</th>
                  <th className="p-4">ISBN</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Copies</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-[#C4B5FD]/80">
                {books.map(bk => (
                  <tr key={bk.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white">{bk.title}</p>
                      <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{bk.author} • {bk.category}</p>
                    </td>
                    <td className="p-4 font-mono">{bk.isbn || '—'}</td>
                    <td className="p-4 font-mono text-[11px]">{bk.shelf_location || '—'}</td>
                    <td className="p-4">
                      <span className="font-bold text-white">{bk.copies_available}</span>
                      <span className="text-[#C4B5FD]/40"> / {bk.copies_total}</span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/library/books/${bk.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold border border-white/5 text-[#C4B5FD]"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
