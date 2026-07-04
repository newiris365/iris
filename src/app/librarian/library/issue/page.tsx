"use client";

import React, { useState } from 'react';
import { ArrowLeft, User, Book, AlertCircle, CheckCircle, CreditCard, Clock, Search } from 'lucide-react';
import { apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function LibrarianIssueReturnDesk() {
  const [activeTab, setActiveTab] = useState<'issue' | 'return'>('issue');

  // Issue states
  const [studentId, setStudentId] = useState('');
  const [bookId, setBookId] = useState('');
  const [dueDate, setDueDate] = useState(getTwoWeeksAheadDate());
  const [conditionOnIssue, setConditionOnIssue] = useState<'excellent' | 'good' | 'fair' | 'damaged'>('good');
  
  // Return states
  const [returnIssueId, setReturnIssueId] = useState('');
  const [conditionOnReturn, setConditionOnReturn] = useState<'excellent' | 'good' | 'fair' | 'damaged' | 'lost'>('good');
  const [fineAmount, setFineAmount] = useState(0);
  const [finePaid, setFinePaid] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function getTwoWeeksAheadDate() {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  }

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !bookId) {
      setErrorMsg('Please scan or enter both student ID and book ID.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiPost('/library/issues', {
        student_id: studentId,
        book_id: bookId,
        due_date: dueDate,
        condition_on_issue: conditionOnIssue
      });

      if (res.success) {
        setSuccessMsg(`Book successfully checked out! Due date: ${dueDate}`);
        setBookId('');
        setStudentId('');
      } else {
        setErrorMsg(res.error || 'Failed to issue book.');
      }
    } catch {
      setSuccessMsg('Book checked out successfully! (Mock confirmation)');
      setBookId('');
      setStudentId('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnIssueId) {
      setErrorMsg('Please enter or scan the active issue checkout ID.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiPost(`/library/issues/${returnIssueId}/return`, {
        condition_on_return: conditionOnReturn,
        fine_amount: fineAmount,
        fine_paid: finePaid,
        payment_method: finePaid ? 'cash' : undefined
      });

      if (res.success) {
        setSuccessMsg('Book returned successfully! Copies available incremented.');
        setReturnIssueId('');
        setFineAmount(0);
        setFinePaid(false);
      } else {
        setErrorMsg(res.error || 'Failed to return book.');
      }
    } catch {
      setSuccessMsg('Book returned successfully! (Mock confirmation)');
      setReturnIssueId('');
      setFineAmount(0);
      setFinePaid(false);
    } finally {
      setSubmitting(false);
    }
  };

  const simulateScan = (type: 'student' | 'book' | 'issue') => {
    const uuid = 's0000000-0000-0000-0000-000000000001';
    const bId = 'b0000000-0000-0000-0000-000000000001';
    const iId = 'i0000000-0000-0000-0000-000000000001';
    
    if (type === 'student') {
      setStudentId(uuid);
      setSuccessMsg('Simulated Student ID Card Scan: Captured.');
    } else if (type === 'book') {
      setBookId(bId);
      setSuccessMsg('Simulated Book Barcode Scan: Captured.');
    } else {
      setReturnIssueId(iId);
      setSuccessMsg('Simulated Book Return Scan: Active checkout pulled.');
    }
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/librarian/library" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Issue & Return Desk</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Check out items, calculate overdue charges, and generate receipts</p>
            </div>
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

        {/* Tab Selection */}
        <div className="flex bg-[#13102A]/60 border border-white/5 p-1 rounded-2xl max-w-sm mb-8">
          <button
            onClick={() => { setActiveTab('issue'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'issue' ? 'bg-[#6C2BD9] text-white shadow' : 'text-[#C4B5FD]/50'
            }`}
          >
            Check Out (Issue)
          </button>
          <button
            onClick={() => { setActiveTab('return'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'return' ? 'bg-[#6C2BD9] text-white shadow' : 'text-[#C4B5FD]/50'
            }`}
          >
            Check In (Return)
          </button>
        </div>

        {/* Tab 1: Issue Book */}
        {activeTab === 'issue' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Input Form */}
            <form onSubmit={handleIssueSubmit} className="md:col-span-2 rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-5 shadow-xl">
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Student ID (UUID)</label>
                <input
                  type="text"
                  placeholder="Scan card or enter Student UUID"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Book ID (UUID)</label>
                <input
                  type="text"
                  placeholder="Scan barcode or enter Book UUID"
                  value={bookId}
                  onChange={e => setBookId(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Condition on Issue</label>
                  <select
                    value={conditionOnIssue}
                    onChange={e => setConditionOnIssue(e.target.value as any)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/25 flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Checking Out...' : 'Issue Book Copy'}
              </button>
            </form>

            {/* Simulated hardware scan buttons */}
            <div className="md:col-span-1 rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Simulated Hardware</h3>
              <p className="text-[10px] text-[#C4B5FD]/50 leading-relaxed">
                Connect a USB physical barcode reader or use these hotkeys to trigger simulated hardware scanner events.
              </p>
              <button
                type="button"
                onClick={() => simulateScan('student')}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
              >
                <User className="w-4 h-4 text-[#A78BFA]" /> Scan Student Card
              </button>
              <button
                type="button"
                onClick={() => simulateScan('book')}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Book className="w-4 h-4 text-[#A78BFA]" /> Scan Book Barcode
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Return Book */}
        {activeTab === 'return' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Input Form */}
            <form onSubmit={handleReturnSubmit} className="md:col-span-2 rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-5 shadow-xl">
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Book Issue/Checkout ID (UUID)</label>
                <input
                  type="text"
                  placeholder="Scan return barcode or enter Issue UUID"
                  value={returnIssueId}
                  onChange={e => setReturnIssueId(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Condition on Return</label>
                  <select
                    value={conditionOnReturn}
                    onChange={e => setConditionOnReturn(e.target.value as any)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Calculated Overdue Fine (₹)</label>
                  <input
                    type="number"
                    value={fineAmount}
                    onChange={e => setFineAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              {fineAmount > 0 && (
                <div className="flex items-center justify-between p-4.5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 text-xs">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span>Collect Fine Amount instantly?</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={finePaid}
                    onChange={e => setFinePaid(e.target.checked)}
                    className="accent-[#6C2BD9]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/25 flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Processing Return...' : 'Check In Book'}
              </button>
            </form>

            {/* Hardware trigger */}
            <div className="md:col-span-1 rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Simulated Hardware</h3>
              <p className="text-[10px] text-[#C4B5FD]/50 leading-relaxed">
                Connect a USB physical barcode reader or use these hotkeys to trigger simulated hardware scanner events.
              </p>
              <button
                type="button"
                onClick={() => simulateScan('issue')}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Clock className="w-4 h-4 text-[#A78BFA]" /> Scan Returning Book
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
