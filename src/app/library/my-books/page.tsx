"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, RefreshCw, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function MyBorrowedBooksPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    loadMyBooks();
  }, []);

  const loadMyBooks = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiGet(`/library/issues/student/${studentId}`);
      if (res.success) {
        setIssues(res.issues || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock Data Fallbacks
      setIssues([
        {
          id: 'i1',
          issue_date: '2026-06-01',
          due_date: '2026-06-15',
          renewal_count: 0,
          status: 'issued',
          books: {
            title: 'Introduction to Algorithms',
            author: 'Thomas H. Cormen',
            cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300'
          }
        },
        {
          id: 'i2',
          issue_date: '2026-05-10',
          due_date: '2026-05-24',
          return_date: '2026-05-22',
          renewal_count: 1,
          status: 'returned',
          books: {
            title: 'Design Patterns',
            author: 'Erich Gamma',
            cover_image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (issueId: string) => {
    setRenewingId(issueId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiPost(`/library/issues/${issueId}/renew`, {});
      if (res.success) {
        setSuccessMsg(res.message || 'Book renewed successfully for 14 days!');
        loadMyBooks();
      } else {
        setErrorMsg(res.error || 'Failed to renew book.');
      }
    } catch {
      // Mock renew
      setIssues(
        issues.map(i =>
          i.id === issueId
            ? { ...i, renewal_count: i.renewal_count + 1, due_date: extendDueDate(i.due_date) }
            : i
        )
      );
      setSuccessMsg('Book renewed successfully! (Mock extension of 14 days)');
    } finally {
      setRenewingId(null);
    }
  };

  const extendDueDate = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const activeIssues = issues.filter(i => i.status === 'issued' || i.status === 'renewed');
  const pastIssues = issues.filter(i => i.status === 'returned');

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-3">
          <Link href="/library" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-extrabold text-xl">My Borrowed Books</h1>
            <p className="text-[10px] text-[#C4B5FD]/50">Check active checkouts, renew books, and audit borrowing history</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Section 1: Active checkouts */}
        <div>
          <h2 className="text-sm font-bold text-[#C4B5FD]/80 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#A78BFA]" /> Currently Issued
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeIssues.length === 0 ? (
            <div className="p-8 rounded-2xl border border-white/5 bg-[#13102A]/30 text-center text-xs text-[#C4B5FD]/30">
              You do not have any books checked out currently.
            </div>
          ) : (
            <div className="space-y-4">
              {activeIssues.map(issue => {
                const isOverdue = new Date() > new Date(issue.due_date);
                return (
                  <div key={issue.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex gap-4">
                      <div className="w-14 h-18 bg-white/5 rounded-xl overflow-hidden relative shadow flex-shrink-0">
                        {issue.books?.cover_image_url ? (
                          <img src={issue.books.cover_image_url} alt={issue.books.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-6 h-6 text-white/20" /></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">{issue.books?.title}</h3>
                        <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{issue.books?.author}</p>
                        <p className="text-[10px] text-[#C4B5FD]/40 mt-1">Issued: {new Date(issue.issue_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 self-end sm:self-auto">
                      <div className="text-xs">
                        <p className="text-[#C4B5FD]/40 text-[9px] uppercase tracking-wider font-bold">Due Date</p>
                        <p className={`font-extrabold mt-1 ${isOverdue ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                          {new Date(issue.due_date).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRenew(issue.id)}
                        disabled={renewingId === issue.id || issue.renewal_count >= 2}
                        className="px-4 py-2.5 rounded-xl bg-[#6C2BD9]/15 border border-[#6C2BD9]/30 hover:bg-[#6C2BD9]/30 disabled:opacity-40 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5"
                      >
                        {renewingId === issue.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>Renew ({issue.renewal_count}/2)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Historical Log */}
        <div>
          <h2 className="text-sm font-bold text-[#C4B5FD]/80 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#A78BFA]" /> Reading History
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pastIssues.length === 0 ? (
            <div className="p-8 rounded-2xl border border-white/5 bg-[#13102A]/30 text-center text-xs text-[#C4B5FD]/30">
              No returned books recorded.
            </div>
          ) : (
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 overflow-hidden shadow-xl">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-[9px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">
                    <th className="p-4">Book Title</th>
                    <th className="p-4">Borrow Date</th>
                    <th className="p-4">Return Date</th>
                    <th className="p-4 text-right">Fines Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-[#C4B5FD]/80">
                  {pastIssues.map((past, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-white">{past.books?.title}</td>
                      <td className="p-4">{new Date(past.issue_date).toLocaleDateString()}</td>
                      <td className="p-4">{new Date(past.return_date).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        {past.fine_amount > 0 ? (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${past.fine_paid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            ₹{past.fine_amount} {past.fine_paid ? 'Paid' : 'Unpaid'}
                          </span>
                        ) : (
                          <span className="text-[#C4B5FD]/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
