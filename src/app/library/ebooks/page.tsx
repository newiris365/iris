"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Search, Download, Eye, Bookmark, FileText, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function EbooksPortalPage() {
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // PDF Viewer Modal
  const [viewingEbook, setViewingEbook] = useState<any>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadEbooks();
  }, []);

  const loadEbooks = async () => {
    try {
      const res = await apiGet('/library/ebooks');
      if (res.success) {
        setEbooks(res.ebooks || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock Fallbacks
      setEbooks([
        { id: 'eb1', title: 'Algorithms Design Manual', author: 'Steven S. Skiena', category: 'Textbook', department: 'CSE', semester: '4', description: 'This book serves as the primary textbook for design and analysis of computer algorithms.', file_url: 'https://arxiv.org/pdf/1908.09341.pdf', cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300', download_count: 42, view_count: 120, file_size_mb: 4.8 },
        { id: 'eb2', title: 'Compilers: Principles, Techniques, & Tools', author: 'Alfred V. Aho', category: 'Textbook', department: 'CSE', semester: '5', description: 'Known as the Dragon Book, this is the classic reference guide to compiler design and compiler analysis.', file_url: 'https://arxiv.org/pdf/1801.00293.pdf', cover_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300', download_count: 19, view_count: 89, file_size_mb: 12.3 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = async (val: string) => {
    setSearch(val);
    try {
      const res = await apiGet(`/library/ebooks?search=${val}`);
      if (res.success) setEbooks(res.ebooks || []);
    } catch {
      // Fallback
    }
  };

  const handleOpenPdf = async (ebook: any) => {
    setViewingEbook(ebook);
    setPdfPage(1);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      await apiPost(`/library/ebooks/${ebook.id}/view?studentId=${studentId}`, {});
      // Increment view count in local state
      setEbooks(ebooks.map(eb => eb.id === ebook.id ? { ...eb, view_count: eb.view_count + 1 } : eb));
    } catch {
      // Ignore
    }
  };

  const handleDownload = async (ebook: any) => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      await apiPost(`/library/ebooks/${ebook.id}/download?studentId=${studentId}`, {});
      // Update download count
      setEbooks(ebooks.map(eb => eb.id === ebook.id ? { ...eb, download_count: eb.download_count + 1 } : eb));
      
      // Simulate download link capture
      window.open(ebook.file_url, '_blank');
      showToast(`Downloading file "${ebook.title}"...`);
    } catch {
      window.open(ebook.file_url, '_blank');
    }
  };

  const toggleBookmark = (id: string) => {
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter(b => b !== id));
      showToast('E-resource removed from bookmarks.');
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
      showToast('E-resource bookmarked successfully.');
    }
  };

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/library" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Digital E-Resource Portal</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Check e-books, syllabus materials, and download PDFs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        <div className="flex bg-[#13102A]/60 border border-white/5 rounded-2xl px-4 py-3 items-center gap-3 shadow-lg mb-8 max-w-2xl">
          <Search className="w-5 h-5 text-[#C4B5FD]/50" />
          <input
            type="text"
            placeholder="Search e-books, syllabus files, notes, question papers..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="bg-transparent flex-1 text-sm text-white focus:outline-none placeholder-white/20"
          />
        </div>

        {/* E-resources grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ebooks.length === 0 ? (
          <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
            No e-books configured.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ebooks.map((eb) => (
              <div key={eb.id} className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-5 shadow-xl flex gap-5 hover:border-[#6C2BD9]/20 transition-all">
                <div className="w-24 h-32 rounded-xl bg-white/5 overflow-hidden relative shadow flex-shrink-0">
                  {eb.cover_url ? (
                    <img src={eb.cover_url} alt={eb.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20"><FileText className="w-8 h-8" /></div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="text-xs font-bold text-white leading-snug">{eb.title}</h3>
                      <button
                        onClick={() => toggleBookmark(eb.id)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          bookmarkedIds.includes(eb.id)
                            ? 'bg-[#6C2BD9]/20 border-[#6C2BD9] text-[#A78BFA]'
                            : 'bg-white/5 border-white/5 text-[#C4B5FD]/50 hover:text-white'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{eb.author || 'Academic Staff'}</p>
                    <p className="text-[10px] text-[#C4B5FD]/70 line-clamp-2 mt-2 leading-relaxed">{eb.description}</p>
                  </div>

                  <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3">
                    <div className="flex gap-4 text-[9px] text-[#C4B5FD]/50">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {eb.view_count} Views</span>
                      <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {eb.download_count} Downloads</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenPdf(eb)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-[#C4B5FD] transition-all flex items-center gap-1 border border-white/5"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button
                        onClick={() => handleDownload(eb)}
                        className="px-3 py-1.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-[10px] font-bold text-white transition-all shadow flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download ({eb.file_size_mb}MB)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* simulated online pdf viewer modal */}
      {viewingEbook && (
        <div className="fixed inset-0 bg-[#0D0A1A]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-3xl border border-white/10 bg-[#13102A] w-full max-w-4xl h-[85vh] flex flex-col justify-between shadow-2xl relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#13102A]">
              <div>
                <h3 className="text-sm font-bold text-white truncate max-w-md">{viewingEbook.title}</h3>
                <p className="text-[9px] text-[#C4B5FD]/50 mt-0.5">Author: {viewingEbook.author || 'Academic Staff'}</p>
              </div>
              
              <button
                onClick={() => setViewingEbook(null)}
                className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document body viewport simulation */}
            <div className="flex-1 bg-[#0D0A1A] overflow-y-auto p-8 flex flex-col items-center justify-start text-xs space-y-6">
              <div className="w-full max-w-2xl bg-[#13102A] border border-white/5 rounded-2xl p-6.5 shadow-lg space-y-4">
                <span className="text-[10px] font-mono text-[#A78BFA] uppercase tracking-wider block border-b border-white/5 pb-2">Page {pdfPage} of 14</span>
                
                <h4 className="text-sm font-bold text-white">Section {pdfPage}: System Architectural Overview</h4>
                
                <p className="text-xs text-[#C4B5FD]/80 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                </p>

                <p className="text-xs text-[#C4B5FD]/80 leading-relaxed">
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Section {pdfPage} continues with detailed calculations on the similarity coefficients and system throughput specifications.
                </p>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[10px] text-[#C4B5FD]/40 select-none">
                  [ SIMULATED PDF READER PORT - SCROLL SECURED ]
                </div>
              </div>
            </div>

            {/* Modal Footer (pagination controls) */}
            <div className="p-4 border-t border-white/5 flex justify-between items-center bg-[#13102A]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPdfPage(Math.max(1, pdfPage - 1))}
                  disabled={pdfPage === 1}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 text-[#C4B5FD]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#C4B5FD]/80">Page {pdfPage} / 14</span>
                <button
                  onClick={() => setPdfPage(Math.min(14, pdfPage + 1))}
                  disabled={pdfPage === 14}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 text-[#C4B5FD]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleDownload(viewingEbook)}
                className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Full PDF
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
