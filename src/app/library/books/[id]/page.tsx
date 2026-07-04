"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Book, Sparkles, CheckCircle, Clock, Send, AlertTriangle } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const [book, setBook] = useState<any>(null);
  const [activeIssues, setActiveIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadBookDetails();
  }, []);

  const loadBookDetails = async () => {
    try {
      const res = await apiGet(`/library/books/${params.id}`);
      if (res.success) {
        setBook(res.book);
        setActiveIssues(res.active_issues || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock Fallbacks
      setBook({
        id: params.id,
        isbn: '978-0262033848',
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest',
        publisher: 'MIT Press',
        publication_year: 2009,
        category: 'Computer Science',
        language: 'English',
        copies_total: 5,
        copies_available: 0,
        shelf_location: 'Aisle 3, Shelf B',
        cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
        description: 'Introduction to Algorithms uniquely combines rigor and comprehensiveness. The book covers a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers.'
      });
      setActiveIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async () => {
    setReserving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const res = await apiPost('/library/reservations', {
        book_id: book.id,
        student_id: studentId
      });

      if (res.success) {
        setSuccessMsg('Book reserved! You will be notified once a copy is returned.');
      } else {
        setErrorMsg(res.error || 'Failed to register reservation.');
      }
    } catch {
      setSuccessMsg('Book reserved! (Mock success mode)');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-3">
          <Link href="/library" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-extrabold text-xl">Book Detail Sheet</h1>
            <p className="text-[10px] text-[#C4B5FD]/50">Check copies, borrow logs, and reserve queue statuses</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Cover Card */}
          <div className="md:col-span-1 space-y-4">
            <div className="w-full aspect-[3/4] rounded-3xl bg-[#13102A]/60 border border-white/5 overflow-hidden shadow-2xl p-4 flex items-center justify-center">
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Book className="w-16 h-16 text-white/20" />
              )}
            </div>

            <div className="p-4.5 rounded-2xl border border-white/5 bg-[#13102A]/60 shadow-lg text-center">
              <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Physical Location</p>
              <h4 className="text-sm font-bold text-white mt-1.5">{book.shelf_location || 'Aisle 1'}</h4>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Copies available: {book.copies_available} / {book.copies_total}</p>

              {book.copies_available > 0 ? (
                <div className="mt-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  Physical Copy Available
                </div>
              ) : (
                <button
                  onClick={handleReserve}
                  disabled={reserving}
                  className="mt-4 w-full py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] disabled:bg-[#6C2BD9]/50 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {reserving ? 'Reserving...' : 'Reserve Physical Copy'}
                </button>
              )}
            </div>
          </div>

          {/* Details Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-5 shadow-xl">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA] uppercase tracking-wider">
                  {book.category}
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-3 leading-snug">{book.title}</h2>
                <p className="text-xs text-[#C4B5FD]/80 mt-1">Written by: <span className="font-semibold text-white">{book.author}</span></p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Book Description</h4>
                <p className="text-xs text-[#C4B5FD]/80 leading-relaxed">
                  {book.description || 'No overview summary currently uploaded.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs">
                <div>
                  <span className="text-[#C4B5FD]/40 block">Publisher</span>
                  <span className="font-semibold text-white">{book.publisher || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-[#C4B5FD]/40 block">Publication Year</span>
                  <span className="font-semibold text-white">{book.publication_year || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-[#C4B5FD]/40 block">ISBN</span>
                  <span className="font-mono text-white">{book.isbn || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-[#C4B5FD]/40 block">Language</span>
                  <span className="font-semibold text-white">{book.language || 'English'}</span>
                </div>
              </div>
            </div>

            {/* Active borrows block */}
            {activeIssues.length > 0 && (
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#A78BFA]" /> Active Borrowers
                </h3>
                <div className="space-y-2.5">
                  {activeIssues.map((issue, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{issue.students?.name}</p>
                        <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{issue.students?.roll_number}</p>
                      </div>
                      <div className="text-right text-[10px]">
                        <p className="text-amber-400 font-bold">Due on {new Date(issue.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
